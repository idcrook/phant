# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

phant is a modular logging tool developed by SparkFun Electronics for collecting data from the Internet of Things (IoT). It powers [data.sparkfun.com](http://data.sparkfun.com) and is designed for modular data collection and processing.

## Common Development Tasks

### Building and Testing
- Install dependencies: `npm install`
- Run all tests: `npm test`
- Run a specific test: `nodeunit test/[test_file].js`

### Running the Server
- Start the server: `npm start`
- This launches:
  - HTTP server on port 8080 for data input/output
  - Telnet server on port 8081 for stream creation

### Development Environment
- phant requires Node.js ^0.10.30
- Uses Grunt for build tasks (linting, testing, code beautification)
- Configuration via environment variables:
  - `PHANT_PORT`: HTTP server port (default: 8080)
  - `PHANT_TELNET_PORT`: Telnet server port (default: 8081)
  - `PHANT_STORAGEDIR`: Directory for storing data streams

## Code Architecture

### Main Modules
- `index.js`: Main entry point that creates the Phant object
- `.bin/serve`: Main server script that sets up the system

### Library Components (lib/)
- **Server endpoints**:
  - `http_server.js`: Main HTTP server
  - `https_server.js`: HTTPS server (not commonly used)

- **Data flow**:
  - `http_input.js`: Handles HTTP input streams
  - `http_output.js`: Handles HTTP output streams
  - `telnet_manager.js`: Manages telnet connections for stream creation

- **Data processing streams**:
  - `atom_stream.js`: Basic data stream
  - `field_stream.js`: Field-based stream
  - `filter_stream.js`: Filtering stream
  - `limit_stream.js`: Limit-enforcing stream
  - `sample_stream.js`: Sampling stream
  - `timezone_stream.js`: Timezone handling stream

- **Core components**:
  - `validator.js`: Data validation
  - `memory_throttler.js`: Memory management

### Test Structure
- Tests are located in the `test/` directory
- Uses NodeUnit framework
- Test files correspond to library modules:
  - `http_input_test.js`: Tests for HTTP input
  - `http_output_test.js`: Tests for HTTP output
  - `memory_throttler_test.js`: Tests for memory throttling
  - `telnet_manager_test.js`: Tests for telnet management

### Optional Features
- Supports optional modules via `package.json`:
  - `phant-keychain-hex`: Key management
  - `phant-meta-nedb`: Metadata storage
  - `phant-stream-csv`: CSV stream processing
  - `phant-manager-http`: HTTP manager

## Development Notes
- The codebase uses older Node.js patterns (^0.10.30)
- Grunt is used for linting, testing, and code beautification
- Modular design allows replacement of components
- Extensive use of streams for data processing
- Telnet interface for interactive stream management