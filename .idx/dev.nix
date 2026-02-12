{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
  ];
  env = {};
  idx = {
    extensions = [];
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["bash" "-c" "cd /home/user/claud-deal/frontend && npx next dev -p $PORT"];
          manager = "web";
        };
      };
    };
    workspace = {
      onCreate = {
        install-deps = "cd /home/user/claud-deal/backend && npm install && cd /home/user/claud-deal/frontend && npm install";
      };
      onStart = {
        start-backend = "cd /home/user/claud-deal/backend && npx nest build && node dist/main.js &";
      };
    };
  };
}
