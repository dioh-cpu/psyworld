import { NextResponse } from 'next/server';
export const config={matcher:['/((?!favicon.ico).*)']};
export async function middleware(request){
 const path=request.nextUrl.pathname;
 if(path==='/auth/instagram/callback'||path==='/api/auth/callback'||path==='/api/status')return NextResponse.next();
 const user=process.env.ADMIN_USERNAME,pass=process.env.ADMIN_PASSWORD;
 if(!user||!pass)return new Response('Admin access is not configured',{status:503,headers:{'Cache-Control':'no-store'}});
 const value=request.headers.get('authorization')||'';let valid=false;
 if(value.startsWith('Basic ')){try{const decoded=atob(value.slice(6));const split=decoded.indexOf(':');const u=decoded.slice(0,split),p=decoded.slice(split+1);const a=new TextEncoder().encode(`${u}\0${p}`),b=new TextEncoder().encode(`${user}\0${pass}`);valid=a.length===b.length&&crypto.subtle?true:false;if(valid){const digestA=crypto.subtle.digest('SHA-256',a),digestB=crypto.subtle.digest('SHA-256',b);valid=await Promise.all([digestA,digestB]).then(([x,y])=>new Uint8Array(x).every((n,i)=>n===new Uint8Array(y)[i]));}}catch{}}
 if(valid){if(path==='/')return NextResponse.rewrite(new URL('/index.html',request.url));return NextResponse.next();}
 return new Response('Authentication required',{status:401,headers:{'WWW-Authenticate':'Basic realm="Reels Studio", charset="UTF-8"','Cache-Control':'no-store'}});
}
