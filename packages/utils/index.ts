export function formatDate(date: Date): string {
return new Intl.DateTimeFormat('en-US', {
month: 'short',
day: 'numeric',
year: 'numeric',
}).format(date);
}

export function truncate(str: string, length: number): string{
if (str.lenth <= length) return str;
return str.slice(0, length) +  '...';
}

export * from './ai';