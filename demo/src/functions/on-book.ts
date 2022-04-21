import { WorkerHandler } from 'vivalaakam_seattle_scheduler';
import { log } from 'vivalaakam_seattle_client';

import { HANDLER_HOST, STORAGE_HOST } from '../constants';
import axios from 'axios';
import { Author, Book } from '../types';

export default new WorkerHandler('onBook', async () => {
  const author = await axios.post<Author>(`${HANDLER_HOST}/getAuthor`);

  if (!author.data._id) {
    log('author not exists');
    return;
  }

  const books = await axios.get<Book[]>(
    `${STORAGE_HOST}/class/book?filter=${encodeURI(JSON.stringify({ authorId: author.data._id }))}`
  );

  const resp = await axios.post<Book>(`${STORAGE_HOST}/class/book`, {
    title: `yet another js book ${books.data.length + 1}`,
    authorId: author.data._id,
  });

  log('book created', {
    title: resp.data.title,
  });
});
