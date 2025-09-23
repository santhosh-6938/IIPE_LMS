# Compiler Installation Guide

This guide helps you install the required compilers for the code compiler feature.

## Windows Installation

### 1. Node.js (JavaScript)
- Download from: https://nodejs.org/
- Install the LTS version
- Verify: Open Command Prompt and run `node --version`

### 2. Python
- Download from: https://python.org/
- Make sure to check "Add Python to PATH" during installation
- Verify: Open Command Prompt and run `python --version`

### 3. GCC/G++ (C/C++)
- **Option 1: MinGW-w64**
  - Download from: https://www.mingw-w64.org/
  - Or use MSYS2: https://www.msys2.org/
  - Add MinGW bin directory to PATH
  - Verify: `gcc --version` and `g++ --version`

- **Option 2: Visual Studio Build Tools**
  - Download from: https://visualstudio.microsoft.com/downloads/
  - Install "C++ build tools" workload
  - Verify: `cl` command should be available

### 4. Java JDK
- Download from: https://adoptium.net/
- Install and set JAVA_HOME environment variable
- Verify: `javac -version` and `java -version`

### 5. PHP
- Download from: https://windows.php.net/download/
- Extract to a folder and add to PATH
- Or use XAMPP: https://www.apachefriends.org/
- Verify: `php --version`

### 6. Ruby
- Download from: https://rubyinstaller.org/
- Install with MSYS2 and DevKit
- Verify: `ruby --version`

### 7. Go
- Download from: https://golang.org/dl/
- Install and add to PATH
- Verify: `go version`

## Linux Installation (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt install python3 python3-pip

# Install GCC/G++
sudo apt install build-essential

# Install Java
sudo apt install openjdk-11-jdk

# Install PHP
sudo apt install php

# Install Ruby
sudo apt install ruby

# Install Go
sudo apt install golang-go
```

## macOS Installation

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Python
brew install python

# Install GCC
brew install gcc

# Install Java
brew install openjdk@11

# Install PHP
brew install php

# Install Ruby
brew install ruby

# Install Go
brew install go
```

## Verification Commands

After installation, verify each compiler:

```bash
node --version
python --version
gcc --version
g++ --version
javac -version
java -version
php --version
ruby --version
go version
```

## Troubleshooting

### PATH Issues
If commands are not found, ensure the compiler directories are in your system PATH.

### Windows PATH
1. Open System Properties > Advanced > Environment Variables
2. Edit the PATH variable
3. Add the bin directories for each compiler
4. Restart Command Prompt

### Permission Issues
- Run installation as Administrator on Windows
- Use `sudo` on Linux/macOS

### Version Conflicts
- Ensure you're using compatible versions
- Consider using version managers like nvm for Node.js

## Alternative Solutions

If you can't install all compilers, the system will work with just JavaScript and Python, which are the most commonly available.
