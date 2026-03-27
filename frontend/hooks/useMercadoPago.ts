import { useEffect, useRef } from 'react';

export function useMercadoPago(publicKey: string) {
  const mpRef = useRef<any>(null);

  useEffect(() => {
    if (!publicKey) {
      console.warn('[useMercadoPago] Public key não fornecida. MercadoPago desabilitado.');
      return;
    }
    
    if (window.MercadoPago && !mpRef.current) {
      try {
        mpRef.current = new window.MercadoPago(publicKey, {
          locale: 'pt-BR',
        });
      } catch (error) {
        console.error('[useMercadoPago] Erro ao inicializar MercadoPago:', error);
      }
    }
  }, [publicKey]);

  return mpRef.current;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}
