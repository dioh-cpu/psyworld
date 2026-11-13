(function attachUploadHelper(root) {
  async function putSignedVideo(signedUrl, file, fetchImpl = fetch) {
    const target = new URL(signedUrl);
    if (target.protocol !== 'https:' || !target.searchParams.get('token')) {
      throw new Error('Invalid signed upload URL');
    }
    if (typeof window !== 'undefined' && target.origin === window.location.origin) {
      throw new Error('Signed upload URL points to the Studio origin');
    }

    return fetchImpl(target.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'x-upsert': 'false',
      },
      body: file,
    });
  }

  root.ReelsStudioUpload = { putSignedVideo };
})(typeof window === 'undefined' ? globalThis : window);
