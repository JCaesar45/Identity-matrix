function idMatrix(n) {
  const matrix = [];
  
  // Loop through the rows
  for (let i = 0; i < n; i++) {
    const row = [];
    
    // Loop through the columns
    for (let j = 0; j < n; j++) {
      // If the row index equals the column index, it's the diagonal
      if (i === j) {
        row.push(1);
      } else {
        row.push(0);
      }
    }
    
    // Add the completed row to the matrix
    matrix.push(row);
  }
  
  return matrix;
}
