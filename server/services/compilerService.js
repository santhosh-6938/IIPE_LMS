const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class CompilerService {
  constructor() {
    this.tempDir = os.tmpdir();
    this.availableCompilers = new Map();
    this.supportedLanguages = {
      'javascript': {
        extension: '.js',
        command: 'node',
        args: [],
        timeout: 5000,
        installInstructions: 'Node.js is required. Download from https://nodejs.org/',
        onlineFallback: true
      },
      'python': {
        extension: '.py',
        command: 'python',
        args: [],
        timeout: 5000,
        installInstructions: 'Python is required. Download from https://python.org/',
        onlineFallback: true
      },
      'cpp': {
        extension: '.cpp',
        command: 'g++',
        args: ['-o'],
        compileFirst: true,
        timeout: 10000,
        installInstructions: 'GCC/G++ compiler is required. Install MinGW on Windows or build-essential on Linux.',
        onlineFallback: true
      },
      'c': {
        extension: '.c',
        command: 'gcc',
        args: ['-o'],
        compileFirst: true,
        timeout: 10000,
        installInstructions: 'GCC compiler is required. Install MinGW on Windows or build-essential on Linux.',
        onlineFallback: true
      },
      'java': {
        extension: '.java',
        command: 'javac',
        args: [],
        compileFirst: true,
        timeout: 10000,
        installInstructions: 'Java JDK is required. Download from https://adoptium.net/',
        onlineFallback: true
      },
      'php': {
        extension: '.php',
        command: 'php',
        args: [],
        timeout: 5000,
        installInstructions: 'PHP is required. Download from https://php.net/',
        onlineFallback: true
      },
      'ruby': {
        extension: '.rb',
        command: 'ruby',
        args: [],
        timeout: 5000,
        installInstructions: 'Ruby is required. Download from https://ruby-lang.org/',
        onlineFallback: true
      },
      'go': {
        extension: '.go',
        command: 'go',
        args: ['run'],
        timeout: 10000,
        installInstructions: 'Go is required. Download from https://golang.org/',
        onlineFallback: true
      }
    }; 
    // Check available compilers on startup
    this.checkAvailableCompilers();
  }

  async checkAvailableCompilers() {
    const compilers = [
      { name: 'node', command: 'node --version' },
      { name: 'python', command: 'python --version' },
      { name: 'g++', command: 'g++ --version' },
      { name: 'gcc', command: 'gcc --version' },
      { name: 'javac', command: 'javac -version' },
      { name: 'java', command: 'java -version' },
      { name: 'php', command: 'php --version' },
      { name: 'ruby', command: 'ruby --version' },
      { name: 'go', command: 'go version' }
    ];

    for (const compiler of compilers) {
      try {
        await this.checkCompiler(compiler.name, compiler.command);
      } catch (error) {
        console.warn(`Compiler ${compiler.name} not available:`, error.message);
      }
    }
  }

  async checkCompiler(name, command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.availableCompilers.set(name, false);
          reject(new Error(`${name} not found`));
        } else {
          this.availableCompilers.set(name, true);
          resolve(stdout.trim());
        }
      });
    });
  }

  isCompilerAvailable(compilerName) {
    return this.availableCompilers.get(compilerName) === true;
  }

  async compileAndRun(language, code, input, filename = 'main') {
    try {
      const langConfig = this.supportedLanguages[language.toLowerCase()];
      if (!langConfig) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Check if local compiler is available
      if (this.isCompilerAvailable(langConfig.command)) {
        // Use local compiler
        return await this.runLocally(langConfig, code, input, filename);
      } else {
        // Use online compiler as fallback
        return await this.runOnlineFallback(langConfig, code, input, language);
      }
    } catch (error) {
      throw new Error(`Compilation/Execution failed: ${error.message}`);
    }
  }

  async runLocally(langConfig, code, input, filename) {
    // Create temporary file
    const tempFile = path.join(this.tempDir, `${filename}${langConfig.extension}`);
    await fs.writeFile(tempFile, code);

    let result;
    if (langConfig.compileFirst) {
      result = await this.compileAndExecute(langConfig, tempFile, input, filename);
    } else {
      result = await this.executeDirectly(langConfig, tempFile, input);
    }

    // Clean up temporary files
    await this.cleanup(tempFile, filename);
    return result;
  }

  async runOnlineFallback(langConfig, code, input, language) {
    // For now, return a helpful message with installation instructions
    // In a production environment, you could integrate with online compilers
    return {
      output: '',
      error: `Local compiler not available: ${langConfig.command}. ${langConfig.installInstructions}\n\nTo enable all languages, please install the required compilers. See the installation guide for details.`,
      exitCode: 1
    };
  }

  async compileAndExecute(langConfig, tempFile, input, filename) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Compilation timeout'));
      }, langConfig.timeout);

      try {
        let compileCommand, executeCommand;
        let executablePath;

        switch (langConfig.command) {
          case 'g++':
            executablePath = path.join(this.tempDir, `${filename}.exe`);
            compileCommand = spawn('g++', [...langConfig.args, executablePath, tempFile]);
            break;
          case 'gcc':
            executablePath = path.join(this.tempDir, `${filename}.exe`);
            compileCommand = spawn('gcc', [...langConfig.args, executablePath, tempFile]);
            break;
          case 'javac':
            executablePath = path.join(this.tempDir, `${filename}.class`);
            compileCommand = spawn('javac', [tempFile]);
            break;
          default:
            throw new Error(`Unknown compiler: ${langConfig.command}`);
        }

        let compileError = '';
        compileCommand.stderr.on('data', (data) => {
          compileError += data.toString();
        });

        compileCommand.on('close', async (code) => {
          if (code !== 0) {
            clearTimeout(timeout);
            reject(new Error(`Compilation failed: ${compileError}`));
            return;
          }

          // Execute the compiled program
          try {
            const result = await this.executeCompiledProgram(langConfig, executablePath, input);
            clearTimeout(timeout);
            resolve(result);
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        compileCommand.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`Compilation error: ${error.message}`));
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  async executeDirectly(langConfig, tempFile, input) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, langConfig.timeout);

      let command, args;
      
      if (langConfig.command === 'go') {
        command = 'go';
        args = ['run', tempFile];
      } else {
        command = langConfig.command;
        args = [tempFile];
      }

      const process = spawn(command, args);
      
      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      }

      process.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0 && error) {
          reject(new Error(`Execution failed: ${error}`));
        } else {
          resolve({
            output: output.trim(),
            error: error.trim(),
            exitCode: code
          });
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Execution error: ${error.message}`));
      });
    });
  }

  async executeCompiledProgram(langConfig, executablePath, input) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, langConfig.timeout);

      let command, args;
      
      if (langConfig.command === 'javac') {
        command = 'java';
        args = ['-cp', this.tempDir, path.basename(executablePath, '.class')];
      } else {
        command = executablePath;
        args = [];
      }

      const process = spawn(command, args);
      
      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      }

      process.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0 && error) {
          reject(new Error(`Execution failed: ${error}`));
        } else {
          resolve({
            output: output.trim(),
            error: error.trim(),
            exitCode: code
          });
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Execution error: ${error.message}`));
      });
    });
  }

  async cleanup(tempFile, filename) {
    try {
      // Remove source file
      await fs.unlink(tempFile);

      // Remove compiled files
      const extensions = ['.exe', '.class', '.out'];
      for (const ext of extensions) {
        const compiledFile = path.join(this.tempDir, `${filename}${ext}`);
        try {
          await fs.access(compiledFile);
          await fs.unlink(compiledFile);
        } catch (error) {
          // File doesn't exist, ignore
        }
      }
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup warning:', error.message);
    }
  }

  getSupportedLanguages() {
    return Object.keys(this.supportedLanguages).map(lang => {
      const config = this.supportedLanguages[lang];
      const isAvailable = this.isCompilerAvailable(config.command);
      
      return {
        name: lang.charAt(0).toUpperCase() + lang.slice(1),
        value: lang,
        extension: config.extension,
        available: true, // Always show all languages
        localAvailable: isAvailable,
        installInstructions: isAvailable ? null : config.installInstructions,
        onlineFallback: config.onlineFallback
      };
    });
  }

  getCompilerStatus() {
    const status = {};
    for (const [compiler, available] of this.availableCompilers) {
      status[compiler] = available;
    }
    return status;
  }

  validateCode(code, language) {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: 'Code cannot be empty' };
    }

    if (code.length > 10000) {
      return { valid: false, error: 'Code too long (max 10,000 characters)' };
    }

    // Basic security checks
    const dangerousPatterns = [
      /process\.exit/,
      /require\(/,
      /import\s+os/,
      /subprocess/,
      /exec\(/,
      /eval\(/,
      /system\(/,
      /shell_exec/,
      /passthru/,
      /file_get_contents/,
      /file_put_contents/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return { valid: false, error: 'Code contains potentially dangerous operations' };
      }
    }

    return { valid: true };
  }
}

module.exports = new CompilerService();
