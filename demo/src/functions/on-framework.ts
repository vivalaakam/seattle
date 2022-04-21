import { WorkerHandler } from 'vivalaakam_seattle_scheduler';
import { log } from 'vivalaakam_seattle_client';
import { HANDLER_HOST, STORAGE_HOST } from '../constants';
import axios from 'axios';
import { Author, Framework } from '../types';

export default new WorkerHandler('onFramework', async () => {
  const author = await axios.post<Author>(`${HANDLER_HOST}/getAuthor`);

  if (!author.data._id) {
    log('author not exists');
    return;
  }

  const frameworks = await axios.get<Framework[]>(
    `${STORAGE_HOST}/class/framework?filter=${encodeURI(JSON.stringify({ authorId: author.data._id }))}`
  );

  const resp = await axios.post<Framework>(`${STORAGE_HOST}/class/framework`, {
    title: `yet another js framework ${frameworks.data.length + 1}`,
    authorId: author.data._id,
    repository: `//github.com/js_author_${author.data._id}/js_framework_${author.data._id}_${
      frameworks.data.length + 1
    }`,
  });

  log('framework created', {
    title: resp.data.title,
  });
});
