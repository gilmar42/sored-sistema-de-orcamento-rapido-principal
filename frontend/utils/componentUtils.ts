/**
 * Utilitários para formatação de componentes
 */

interface ComponentSize {
  lengthValue?: number;
  lengthUnit?: string;
  rawLengthInput?: string;
  diameterValue?: number;
  diameterUnit?: string;
  rawDiameterInput?: string;
  widthValue?: number;
  widthUnit?: string;
  rawWidthInput?: string;
  sizeValue?: any;
  sizeUnit?: string;
  rawSizeString?: string; // Campo de fallback da normalização
}

/**
 * Formata o tamanho de um componente de forma consistente
 * @param component - O componente com dados de dimensão
 * @returns String formatada com as dimensões (primeiros 3 caracteres do valor) ou "-" se não houver dados
 */
export const formatComponentSize = (component: ComponentSize): string => {
  const parts: string[] = [];

  // Tentar pegar comprimento
  if (component.lengthValue !== undefined && component.lengthValue !== null) {
    const valueStr = String(component.lengthValue).substring(0, 3);
    parts.push(`C: ${valueStr}${component.lengthUnit || 'mm'}`);
  } else if (component.rawLengthInput && component.rawLengthInput.trim() !== '') {
    const valueStr = component.rawLengthInput.substring(0, 3);
    parts.push(`C: ${valueStr}`);
  }

  // Tentar pegar diâmetro
  if (component.diameterValue !== undefined && component.diameterValue !== null) {
    const valueStr = String(component.diameterValue).substring(0, 3);
    parts.push(`Ø: ${valueStr}${component.diameterUnit || 'mm'}`);
  } else if (component.rawDiameterInput && component.rawDiameterInput.trim() !== '') {
    const valueStr = component.rawDiameterInput.substring(0, 3);
    parts.push(`Ø: ${valueStr}`);
  }

  // Tentar pegar largura
  if (component.widthValue !== undefined && component.widthValue !== null) {
    const valueStr = String(component.widthValue).substring(0, 3);
    parts.push(`L: ${valueStr}${component.widthUnit || 'mm'}`);
  } else if (component.rawWidthInput && component.rawWidthInput.trim() !== '') {
    const valueStr = component.rawWidthInput.substring(0, 3);
    parts.push(`L: ${valueStr}`);
  }

  // Se tiver rawSizeString (campo de fallback da normalização), usar
  if (parts.length === 0 && component.rawSizeString && component.rawSizeString.trim() !== '') {
    const valueStr = String(component.rawSizeString).substring(0, 3);
    return valueStr;
  }

  // Verificar se component tem sizeValue (para compatibilidade com dados não normalizados)
  if (parts.length === 0 && component.sizeValue !== undefined && component.sizeValue !== null) {
    // Se tiver sizeValue como string direta, usar
    if (typeof component.sizeValue === 'string' && component.sizeValue.trim() !== '') {
      const valueStr = String(component.sizeValue).substring(0, 3);
      return valueStr;
    }

    // Se tiver sizeValue como número, converter para string
    if (typeof component.sizeValue === 'number') {
      const valueStr = String(component.sizeValue).substring(0, 3);
      return `${valueStr}${component.sizeUnit || ''}`;
    }

    // Se sizeValue é um objeto, tentar extrair dados
    if (component.sizeValue && typeof component.sizeValue === 'object') {
      // Tentar extrair dados do objeto
      const objParts: string[] = [];
      
      if (component.sizeValue.lengthValue !== undefined && component.sizeValue.lengthValue !== null) {
        const valueStr = String(component.sizeValue.lengthValue).substring(0, 3);
        objParts.push(`C: ${valueStr}${component.sizeValue.lengthUnit || 'mm'}`);
      }
      if (component.sizeValue.diameterValue !== undefined && component.sizeValue.diameterValue !== null) {
        const valueStr = String(component.sizeValue.diameterValue).substring(0, 3);
        objParts.push(`Ø: ${valueStr}${component.sizeValue.diameterUnit || 'mm'}`);
      }
      if (component.sizeValue.widthValue !== undefined && component.sizeValue.widthValue !== null) {
        const valueStr = String(component.sizeValue.widthValue).substring(0, 3);
        objParts.push(`L: ${valueStr}${component.sizeValue.widthUnit || 'mm'}`);
      }
      
      if (objParts.length > 0) {
        const result = objParts.join(' × ');
        return String(result);
      }
    }
  }

  // Retornar dimensões encontradas ou "-" se nada foi encontrado
  const result = parts.length > 0 ? parts.join(' × ') : '-';
  
  // PROTEÇÃO FINAL: Garantir que sempre retornamos uma string
  if (typeof result === 'object') {
    return JSON.stringify(result);
  }
  
  return String(result);
};

/**
 * Formata dimensões individuais para exibição em lista
 * @param component - O componente com dados de dimensão
 * @returns Objeto com dimensões formatadas separadamente
 */
export const formatComponentDimensions = (component: ComponentSize) => {
  const displayLength = component.lengthValue !== undefined && component.lengthValue !== null ? 
    `${component.lengthValue} ${component.lengthUnit || 'mm'}` :
    component.rawLengthInput ? `${component.rawLengthInput} ${component.lengthUnit || 'mm'}` : null;
    
  const displayDiameter = component.diameterValue !== undefined && component.diameterValue !== null ? 
    `${component.diameterValue} ${component.diameterUnit || 'mm'}` :
    component.rawDiameterInput ? `${component.rawDiameterInput} ${component.diameterUnit || 'mm'}` : null;
    
  const displayWidth = component.widthValue !== undefined && component.widthValue !== null ? 
    `${component.widthValue} ${component.widthUnit || 'mm'}` :
    component.rawWidthInput ? `${component.rawWidthInput} ${component.widthUnit || 'mm'}` : null;

  return { displayLength, displayDiameter, displayWidth };
};