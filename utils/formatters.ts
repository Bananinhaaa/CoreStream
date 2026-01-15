
export const formatNumber = (num: number): string => {
  if (num >= 1000000000000) {
    const val = num / 1000000000000;
    return val >= 10 ? Math.floor(val) + 'T' : val.toFixed(1).replace(/\.0$/, '') + 'T';
  }
  if (num >= 1000000000) {
    const val = num / 1000000000;
    return val >= 10 ? Math.floor(val) + 'B' : val.toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    const val = num / 1000000;
    return val >= 10 ? Math.floor(val) + 'M' : val.toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    const val = num / 1000;
    // Se for maior que 10k, não mostra decimal para ficar mais limpo (ex: 542k)
    // Se for menor que 10k, mostra uma casa (ex: 1.2k)
    return val >= 10 ? Math.floor(val) + 'k' : val.toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 5) return 'agora';
  if (diffInSeconds < 60) return `${diffInSeconds}s atrás`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d atrás`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}sem atrás`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mês atrás`;

  return `${Math.floor(diffInMonths / 12)}ano atrás`;
};
