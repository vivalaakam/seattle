const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const charactersLength = characters.length;

export function makeId(length: number) {
  return Array.from({ length })
    .map(() => characters.charAt(Math.floor(Math.random() * charactersLength)))
    .join('');
}
