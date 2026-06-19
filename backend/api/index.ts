import { bootstrapExpress } from '../src/main';

export default async (req: any, res: any) => {
  const server = await bootstrapExpress();
  return server(req, res);
};
