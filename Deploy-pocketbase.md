Because PocketBase is a single self-contained binary with an embedded SQLite database, deploying it is incredibly straightforward. You do not need to configure Docker containers, Postgres clusters, or complex reverse proxies if you don't want to—PocketBase can handle automatic HTTPS all by itself.Here is the standard, production-ready path for deploying PocketBase to a Linux VPS (like DigitalOcean, Hetzner, or AWS) using systemd so it runs continuously in the background.1.Provision the Server & DNS:Requires a basic Linux VPS.Spin up a basic Linux server (even a $4-$5/month tier is plenty for PocketBase). Once you have the server's public IP address, go to your domain registrar and create an A Record pointing a subdomain to that IP—for example, api.grimmconsult.tech.2.Upload Your Database:Preserve your 31,000 verses.SSH into your new server, download the Linux version of PocketBase, and copy your local pb_data folder over so you don't lose the scriptures or your locked-down API rules.From your local machine, run this to securely copy your database to the server:Bashscp -r ./pb_data root@your-server-ip:/root/pocketbase/
3.Create a Systemd Service:Keeps PocketBase running permanently.On the server, you need to create a background service so PocketBase starts automatically if the server reboots.Create a file at /lib/systemd/system/pocketbase.service and paste this configuration:Ini, TOML[Unit]
Description=PocketBase

[Service]
Type=simple
User=root
# Replace with the actual path to your pocketbase binary
ExecStart=/root/pocketbase/pocketbase serve --http=0.0.0.0:80 --https=0.0.0.0:443 --dir=/root/pocketbase/pb_data

[Install]
WantedBy=multi-user.target
Note: PocketBase will automatically reach out to Let's Encrypt and generate a free SSL certificate for you when it binds to port 443.4.Start the Service:Enable and start the service with these two commands:Bashsystemctl enable pocketbase
systemctl start pocketbase
You can now navigate to [https://api.grimmconsult.tech/_/](https://api.grimmconsult.tech/_/) to log into your live, securely encrypted Admin UI.5.Update Your Clients:Point the code to production.Finally, update your client code to point to the live server.In your Go CLI (main.go), do a global find-and-replace:Change: [http://127.0.0.1:8090](http://127.0.0.1:8090)To: [https://api.grimmconsult.tech](https://api.grimmconsult.tech)In your React Web App (src/lib/pb.js), update the SDK initialization:export const pb = new PocketBase('[https://api.grimmconsult.tech](https://api.grimmconsult.tech)');Once the server is running and the URLs are updated, your Go TUI will be able to query scriptures and save study materials from any terminal in the world.