import React from 'react';

interface Props {
  isOpen: boolean;
  blob: Blob | null;
  filename?: string;
  onClose: () => void;
}

const PdfActionModal: React.FC<Props> = ({ isOpen, blob, filename = 'document.pdf', onClose }) => {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && blob) {
      const u = URL.createObjectURL(blob);
      setUrl(u);
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
      setUrl(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, blob]);

  if (!isOpen) return null;

  const handleOpen = () => {
    if (!url) return;
    window.open(url, '_blank');
    onClose();
  };

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-surface p-6 rounded-lg z-10 w-11/12 max-w-md">
        <h3 className="text-lg font-semibold mb-4">PDF gerado</h3>
        <p className="text-sm text-textSecondary mb-4">Deseja abrir o PDF em uma nova aba ou baixá-lo?</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-3 py-2 bg-gray-700 text-white rounded">Cancelar</button>
          <button onClick={handleDownload} className="px-3 py-2 bg-blue-600 text-white rounded">Baixar</button>
          <button onClick={handleOpen} className="px-3 py-2 bg-green-600 text-white rounded">Abrir</button>
        </div>
      </div>
    </div>
  );
};

export default PdfActionModal;
