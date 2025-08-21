# Excalidraw to YouTube Video Pipeline

A novel pipeline using Claude AI to convert Excalidraw drawings into animated YouTube videos without relying on the Model Context Protocol (MCP).

## Overview

This project demonstrates autonomous AI workflows for content creation, converting static Excalidraw diagrams into engaging animated videos suitable for YouTube upload.

## Features

- **Zero-MCP Approach**: Direct AI integration without dependency on Model Context Protocol
- **Customizable Animation Speeds**: Adjustable playback rates (e.g., 0.75x)
- **Excalidraw Integration**: Leverages dai-shi/excalidraw-animate for timestamped object sequencing
- **YouTube-Ready Output**: Generates videos optimized for YouTube upload

## Project Structure

```
excalidraw-video-pipeline/
├── src/
│   ├── animation/          # Animation generation logic
│   ├── processing/         # Excalidraw file processing
│   └── export/             # Video export utilities
├── examples/
│   └── sample-drawings/    # Sample Excalidraw files
├── output/                 # Generated video files
├── docs/                   # Documentation
└── tests/                  # Test files
```

## Getting Started

1. Clone or download Excalidraw files
2. Configure animation parameters
3. Run the pipeline to generate animated videos
4. Export for YouTube upload

## Dependencies

- Claude AI integration
- dai-shi/excalidraw-animate
- Video processing tools
- Animation libraries

## Animation Process

The pipeline timestamps objects in Excalidraw drawings for sequenced playback, creating smooth animations that tell a visual story.

## Contributing

This project explores AI-driven content creation capabilities and challenges traditional dependency frameworks like MCP.

## License

[Add your preferred license]
