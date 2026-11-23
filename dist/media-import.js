/* File picker helpers: do not retain transient cloud File handles in IndexedDB. */
window.TCMediaImport=(()=>{
  const videoExt=/\.(mp4|webm|mov|m4v|avi)$/i;
  const mediaExt=/\.(mp3|wav|m4a|aac|aif|aiff|ogg|opus|flac|mp4|webm|mov|m4v|avi)$/i;
  const mimeFor={mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',aac:'audio/aac',aif:'audio/aiff',aiff:'audio/aiff',ogg:'audio/ogg',opus:'audio/ogg',flac:'audio/flac',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',m4v:'video/mp4',avi:'video/x-msvideo'};
  const isVideo=f=>String(f.type||'').startsWith('video/')||videoExt.test(f.name||'');
  const isMedia=f=>/^(audio|video)\//.test(f.type||'')||mediaExt.test(f.name||'');
  const isAVI=file=>/\.avi$/i.test(file.name || '') || /^(?:video\/(?:x-msvideo|avi|msvideo))$/i.test(file.type || '');
  async function convertAVI(bytes){
    const worker=new Worker('./avi-worker.js',{type:'module'});
    try{
      return await new Promise((resolve,reject)=>{
        const failure=()=>reject(new Error('Não foi possível converter o AVI. Confira a conexão e tente novamente ou use MP4 (H.264/AAC).'));
        const timeout=setTimeout(failure,600000);
        worker.onerror=()=>{clearTimeout(timeout);failure();};
        worker.onmessage=({data})=>{
          clearTimeout(timeout);
          if(data.error || !data.output?.byteLength)failure();
          else resolve(new Blob([data.output],{type:'video/mp4'}));
        };
        worker.postMessage(bytes,[bytes]);
      });
    }finally{worker.terminate();}
  }
  async function readBlob(file){
    if(!file.size){const err=new Error('empty');err.name='EmptyFileError';throw err;}
    if(isAVI(file) && file.size>100*1024*1024)throw Object.assign(new Error('O AVI excede 100 MB. Converta para MP4 (H.264/AAC) antes de importar.'),{name:'VideoImportError'});
    const bytes=typeof file.arrayBuffer==='function'?await file.arrayBuffer():await new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('read'));reader.onabort=()=>{const err=new Error('aborted');err.name='AbortError';reject(err)};reader.readAsArrayBuffer(file);
    });
    if(bytes.byteLength!==file.size){const err=new Error('incomplete');err.name='NotReadableError';throw err;}
    if(isAVI(file)){
      try{return await convertAVI(bytes);}
      catch(error){error.name='VideoImportError';throw error;}
    }
    const extension=String(file.name||'').split('.').pop().toLowerCase();
    const type=/^(audio|video)\//.test(file.type||'')?file.type:(mimeFor[extension]||'application/octet-stream');
    return new Blob([bytes],{type});
  }
  function errorMessage(err){
    if(err?.name==='VideoImportError')return err.message;
    if(err?.name==='QuotaExceededError')return 'Sem espaço local. Libere espaço no aparelho ou remova faixas e tente novamente.';
    if(err?.name==='EmptyFileError')return 'Arquivo vazio ou ainda não baixado. Baixe no app Arquivos e selecione novamente.';
    if(['NotReadableError','NotFoundError','AbortError'].includes(err?.name))return 'Não foi possível ler o arquivo. Baixe no app Arquivos (No Meu iPhone) e tente novamente.';
    if(['SecurityError','InvalidStateError'].includes(err?.name))return 'Armazenamento indisponível. Reabra o app fora da navegação privada e tente novamente.';
    return 'Não foi possível importar. Confirme que o arquivo está baixado no aparelho e tente um MP3 menor. Se persistir, informe o nome e o tamanho do arquivo.';
  }
  return {isVideo,isMedia,isAVI,readBlob,errorMessage};
})();
