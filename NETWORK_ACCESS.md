# Network Access Instructions for EdgeTech Employee Portal

## Prerequisites
- Node.js must be installed
- The application must be running on the host machine

## Steps to Make the Application Accessible on Local Network

1. **Run the start-network.bat file**
   - Double-click on `start-network.bat` in the project root folder
   - This will start the application and display your IP address

2. **Allow Through Firewall**
   - You'll need administrator privileges
   - Run Command Prompt as Administrator
   - Execute this command:
     ```
     netsh advfirewall firewall add rule name="EdgeTech Portal" dir=in action=allow protocol=TCP localport=3003
     ```

3. **Access from Other Devices**
   - From any device on the same network, open a browser
   - Navigate to: `http://[HOST-IP-ADDRESS]:3003`
   - Replace [HOST-IP-ADDRESS] with the IP address displayed when running start-network.bat

## Troubleshooting

1. **Cannot Connect to the Application**
   - Ensure the application is running on the host machine
   - Check if the firewall rule is properly set
   - Verify you're using the correct IP address
   - Make sure all devices are on the same network

2. **Application Only Works on Localhost**
   - Check if HOST=0.0.0.0 is set in the start command
   - Restart the application using start-network.bat

3. **Application Starts But Shows Error**
   - Check the console output for specific error messages
   - Ensure port 3003 is not being used by another application 