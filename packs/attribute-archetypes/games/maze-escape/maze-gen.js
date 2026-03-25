/**
 * Procedural maze generator using Recursive Backtracker (DFS).
 * Guarantees S→K→E is always reachable.
 * Grid is (2*cols+1) x (2*rows+1) with walls on even indices.
 *
 * Usage: generateMaze(5, 5) → string[] (11x11 grid with S, K, E placed)
 */
function generateMaze(cols, rows) {
  const w = 2 * cols + 1;
  const h = 2 * rows + 1;
  // Initialize all walls
  const grid = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      row.push('#');
    }
    grid[y] = row;
  }

  // Carve cells — cells are at odd coordinates
  const visited = new Set();
  const dirs = [[0,-1],[1,0],[0,1],[-1,0]];

  function cellKey(cx, cy) { return cx + ',' + cy; }

  function carve(cx, cy) {
    visited.add(cellKey(cx, cy));
    grid[cy * 2 + 1][cx * 2 + 1] = '.';
    // Shuffle directions
    const shuffled = dirs.slice().sort(() => Math.random() - 0.5);
    for (const [dx, dy] of shuffled) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited.has(cellKey(nx, ny))) {
        // Remove wall between current and next
        grid[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = '.';
        carve(nx, ny);
      }
    }
  }

  carve(0, 0);

  // Place S at top-left cell, E at bottom-right, K somewhere in the middle
  grid[1][1] = 'S';

  // Find a good key position — roughly center area
  const kx = 2 * Math.floor(cols / 2) + 1;
  const ky = 2 * Math.floor(rows / 2) + 1;
  grid[ky][kx] = 'K';

  // Place exit at bottom-right cell
  grid[h - 2][w - 2] = 'E';

  // Convert to string array
  return grid.map(row => row.join(''));
}
