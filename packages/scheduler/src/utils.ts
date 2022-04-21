export async function sleep(ms = 0) {
  return new Promise(resolve => {
    setTimeout(() => resolve(null), ms);
  });
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const charactersLength = characters.length;

export function makeId(length: number) {
  return Array.from({ length })
    .map(() => characters.charAt(Math.floor(Math.random() * charactersLength)))
    .join('');
}
