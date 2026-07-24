function idMatrix(n) {
  return Array.from({ length: n }, (_, i) => 
    Array.from({ length: n }, (_, j) => i === j ? 1 : 0)
  );
}
