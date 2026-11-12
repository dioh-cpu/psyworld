import path from 'node:path';
import {fileURLToPath} from 'node:url';
const appRoot=path.dirname(fileURLToPath(import.meta.url));
/** @type {import('next').NextConfig} */
const nextConfig={
 outputFileTracingRoot:appRoot,
 async rewrites(){return [
  {source:'/auth/instagram',destination:'/api/auth/start'},
  {source:'/auth/instagram/callback',destination:'/api/auth/callback'},
  {source:'/auth/logout',destination:'/api/auth/logout'}
 ]}
};
export default nextConfig;
