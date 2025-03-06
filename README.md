# VOID - A Minimalist Combat Racing Game

A sleek, monochromatic racing game where you battle against AI cars in a vast wireframe arena. The game features a unique visual style with wireframe graphics and dramatic visual effects.

[Try it on CodePen](https://codepen.io/OmPreetham/pen/xbxrRMB) | [View Source](https://github.com/OmPreetham/void)

## Features

### Visual Design
- Minimalist wireframe graphics in black, white, and shades of gray
- Dynamic health-based color system for player car
- Dramatic visual effects for collisions, lasers, and car destruction
- Clean, grid-based environment with subtle lighting

### Gameplay
- Fast-paced combat racing
- 50 AI opponents
- Laser combat system with visual trails
- Physics-based collision system
- Health system with visual feedback
- Dramatic death and respawn effects

### Controls
- **Arrow Up**: Accelerate
- **Arrow Down**: Brake/Reverse
- **Arrow Left/Right**: Turn
- **Spacebar**: Shoot laser
- **Spacebar** (when game over): Restart game

### Special Effects
- Laser trails and impact effects
- Collision feedback
- Car destruction animation with debris
- Spawn effects for all cars
- Dramatic restart sequence
- Pulsing "GAME OVER" message

## Setup

1. Clone this repository
2. Start a local server (e.g., `python3 -m http.server 8080`)
3. Open your web browser and navigate to `http://localhost:8080`

## Technical Details

Built using:
- Three.js for 3D graphics
- Pure JavaScript for game logic
- HTML5 Canvas for rendering
- CSS for UI elements

## Game Mechanics

### Player Car
- Health-based color system (white to dark gray)
- Increased mass for better handling
- Laser shooting capability
- Dynamic speed and handling

### AI Cars
- Independent movement patterns
- Automatic shooting
- Collision avoidance
- Spawn across the arena

### Combat System
- Fast-firing laser system
- Visual hit feedback
- Health-based damage
- Destruction effects

## Tips
- Use your momentum to avoid enemy fire
- Watch your health (indicated by car color)
- Use the grid for spatial awareness
- Keep moving to avoid being surrounded

Enjoy the game! 