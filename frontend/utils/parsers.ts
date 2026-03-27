export const parseDimensionInput = (input: string): number | null => {
    const trimmedInput = input.trim();

    let cleanedInput = trimmedInput.replace(/"|in|mm|cm|ft|m/g, '').trim();

    if (!cleanedInput) {
      return null; // Retorna null para entrada vazia ou apenas espaços após a limpeza
    }

   // Tenta parsear frações (ex: 1/2, 3/4, 1 1/2)
   const fractionRegex = /^(?:(\d+)\s+)?(\d+)\/(\d+)$/;
   const match = cleanedInput.match(fractionRegex);

   if (match) {
     const whole = match[1] ? parseInt(match[1]) : 0;
     const numerator = parseInt(match[2]);
     const denominator = parseInt(match[3]);

     if (denominator === 0) {
       return null; // Denominador zero é inválido
     }
     return whole + (numerator / denominator);
   }

   // Tenta converter diretamente para número (inteiros e decimais)
   const numberRegex = /^-?(?:\d+\.?\d*|\.\d+)$/; // Regex para validar números inteiros, decimais ou que começam com ponto decimal
   if (numberRegex.test(cleanedInput)) {
     const directNumber = parseFloat(cleanedInput);
     if (!isNaN(directNumber)) {
       return directNumber;
     }
   }

   return null; // Se não corresponder a nenhum padrão, retorne null
 };