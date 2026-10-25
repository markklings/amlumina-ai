const numberFmt = new Intl.NumberFormat("en-US");
export const formatNumber = (n: number) => numberFmt.format(n);
