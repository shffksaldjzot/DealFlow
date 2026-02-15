import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Contract } from './entities/contract.entity';
import { ContractField } from './entities/contract-field.entity';
import { ContractFieldValue } from './entities/contract-field-value.entity';
import { ContractSignature } from './entities/contract-signature.entity';
import { FilesService } from '../files/files.service';

@Injectable()
export class SignedPdfService {
  private readonly logger = new Logger(SignedPdfService.name);
  private fontBytes: Buffer | null = null;

  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(ContractField)
    private readonly fieldRepository: Repository<ContractField>,
    @InjectRepository(ContractFieldValue)
    private readonly fieldValueRepository: Repository<ContractFieldValue>,
    @InjectRepository(ContractSignature)
    private readonly signatureRepository: Repository<ContractSignature>,
    private readonly filesService: FilesService,
  ) {}

  private async loadFont(): Promise<Buffer> {
    if (this.fontBytes) return this.fontBytes;

    // Try dist path first, then src path (for dev)
    const distPath = path.join(__dirname, '..', '..', 'assets', 'fonts', 'NotoSansKR-Regular.ttf');
    const srcPath = path.join(process.cwd(), 'src', 'assets', 'fonts', 'NotoSansKR-Regular.ttf');

    for (const fontPath of [distPath, srcPath]) {
      if (fs.existsSync(fontPath)) {
        this.fontBytes = fs.readFileSync(fontPath);
        return this.fontBytes;
      }
    }

    return null;
  }

  async generateSignedPdf(contractId: string): Promise<void> {
    try {
      const contract = await this.contractRepository.findOne({
        where: { id: contractId },
        relations: ['template'],
      });
      if (!contract || !contract.template) {
        this.logger.warn(`Contract or template not found: ${contractId}`);
        return;
      }

      const fields = await this.fieldRepository.find({
        where: { templateId: contract.templateId },
      });
      const fieldValues = await this.fieldValueRepository.find({
        where: { contractId },
      });
      const signature = await this.signatureRepository.findOne({
        where: { contractId },
        order: { signedAt: 'DESC' },
      });

      const fieldValueMap = new Map<string, string>();
      for (const fv of fieldValues) {
        fieldValueMap.set(fv.fieldId, fv.value);
      }

      // Load template file
      let templateFileBuffer: Buffer | null = null;
      try {
        const { buffer } = await this.filesService.getFileBuffer(contract.template.fileId);
        templateFileBuffer = buffer;
      } catch {
        this.logger.warn(`Template file not found for contract: ${contractId}`);
        return;
      }

      let pdfDoc: PDFDocument;
      const isPdf = contract.template.fileType === 'pdf';

      if (isPdf) {
        pdfDoc = await PDFDocument.load(templateFileBuffer);
      } else {
        pdfDoc = await PDFDocument.create();
        // Embed image as full-page background
        const imgEmbed = contract.template.fileType === 'png'
          ? await pdfDoc.embedPng(templateFileBuffer)
          : await pdfDoc.embedJpg(templateFileBuffer);

        const imgWidth = imgEmbed.width;
        const imgHeight = imgEmbed.height;

        const page = pdfDoc.addPage([imgWidth, imgHeight]);
        page.drawImage(imgEmbed, {
          x: 0,
          y: 0,
          width: imgWidth,
          height: imgHeight,
        });
      }

      // Register fontkit and embed Korean font
      pdfDoc.registerFontkit(fontkit);
      const fontBuffer = await this.loadFont();
      let font: any;
      if (fontBuffer) {
        font = await pdfDoc.embedFont(fontBuffer);
      } else {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        this.logger.warn('Korean font not found, falling back to Helvetica');
      }

      // Draw field values on each page
      const pages = pdfDoc.getPages();

      for (const field of fields) {
        if (field.fieldType === 'signature') continue;
        const value = fieldValueMap.get(field.id);
        if (!value) continue;

        const pageIndex = (field.pageNumber || 1) - 1;
        const page = pages[pageIndex] || pages[0];
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Convert percentage-based positions to PDF coordinates
        const x = (field.positionX / 100) * pageWidth;
        // PDF origin is bottom-left, but our positions are from top-left
        const fieldHeight = (field.height / 100) * pageHeight;
        const y = pageHeight - (field.positionY / 100) * pageHeight - fieldHeight;

        if (field.fieldType === 'checkbox') {
          if (value === 'true') {
            const size = Math.min(fieldHeight, 14);
            page.drawText('✓', {
              x: x + 2,
              y: y + (fieldHeight - size) / 2,
              size,
              font,
              color: rgb(0, 0, 0),
            });
          }
        } else {
          const fontSize = Math.min(Math.max(fieldHeight * 0.6, 8), 14);
          page.drawText(value, {
            x: x + 2,
            y: y + (fieldHeight - fontSize) / 2,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }

      // Draw signature
      const signatureField = fields.find(f => f.fieldType === 'signature');
      if (signature?.signatureData && signatureField) {
        try {
          // signatureData is a base64 data URL (data:image/png;base64,...)
          const base64Data = signature.signatureData.split(',')[1];
          if (base64Data) {
            const sigBuffer = Buffer.from(base64Data, 'base64');
            const sigImage = await pdfDoc.embedPng(sigBuffer);

            const pageIndex = (signatureField.pageNumber || 1) - 1;
            const page = pages[pageIndex] || pages[0];
            const { width: pageWidth, height: pageHeight } = page.getSize();

            const sigX = (signatureField.positionX / 100) * pageWidth;
            const sigW = (signatureField.width / 100) * pageWidth;
            const sigH = (signatureField.height / 100) * pageHeight;
            const sigY = pageHeight - (signatureField.positionY / 100) * pageHeight - sigH;

            page.drawImage(sigImage, {
              x: sigX,
              y: sigY,
              width: sigW,
              height: sigH,
            });
          }
        } catch (err) {
          this.logger.warn(`Failed to embed signature image: ${err.message}`);
        }
      }

      // Save the PDF to a buffer
      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);

      // Save via FilesService (create a Multer-like file object)
      const multerFile = {
        buffer: pdfBuffer,
        originalname: `contract-${contract.contractNumber}-signed.pdf`,
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
      } as Express.Multer.File;

      const savedFile = await this.filesService.uploadFile(
        multerFile,
        contract.createdBy,
        'signed_contract',
      );

      // Update contract with signedPdfFileId
      await this.contractRepository.update(contractId, {
        signedPdfFileId: savedFile.id,
      });

      this.logger.log(`Signed PDF generated for contract ${contract.contractNumber}`);
    } catch (err) {
      this.logger.error(`Failed to generate signed PDF for contract ${contractId}: ${err.message}`);
    }
  }
}
