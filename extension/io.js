(function(window, document, undefined){
  window.myStyle = window.myStyle || {};

  var MAX_TOTAL_SIZE = 5 * 1024 * 1024; /* 5 MB */
  var STYLE_DIR = 'my-styles';

  var errHandler = function(error) {
    var msg = '';

    switch (error.code) {
      case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'QUOTA_EXCEEDED_ERR';
        break;
      case FileError.NOT_FOUND_ERR:
        msg = 'NOT_FOUND_ERR';
        break;
      case FileError.SECURITY_ERR:
        msg = 'SECURITY_ERR';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        msg = 'INVALID_MODIFICATION_ERR';
        break;
      case FileError.INVALID_STATE_ERR:
        msg = 'INVALID_STATE_ERR';
        break;
      default:
        msg = 'Unknown Error';
        break;
    };

    console.log('File Access Error: ' + msg);
  };

  var getFilesystem = function(cb) {
    var requestFileSystem = window.requestFileSystem || 
      window.webkitRequestFileSystem;

    window.webkitStorageInfo.requestQuota(PERSISTENT, MAX_TOTAL_SIZE, 
      function(grantedSize){
        requestFileSystem(PERSISTENT, grantedSize, cb, errHandler);
      }
    , errHandler);
  }

  var getDirectory = function(fs, cb) {
    fs.root.getDirectory(STYLE_DIR, { create: true }, cb, errHandler);
  };

  var getFileEntry = function(hash, options, cb) {
    getFilesystem(function(fs) {
      getDirectory(fs, function(dir) {

        dir.getFile(hash + '.css', options, cb, function(err){
          if (err.code === FileError.NOT_FOUND_ERR)
            cb(undefined);
          else
            errHandler(err);
        });
      }, errHandler);
    }, errHandler);
  };

  window.myStyle.loadStyles = function (hash, cb) {
    getFileEntry(hash, {}, function(fileEntry) {

      if (fileEntry === undefined){
        // The file doesn't exist yet
        cb(undefined);
        return;
      }

      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.addEventListener('loadend', function(){
          cb(this.result);
        });

        reader.readAsText(file);
      }, errHandler);
    });
  };

  window.myStyle.saveStyles = function (hash, style, cb) {
    getFileEntry(hash, {create: true}, function(fileEntry) {
      fileEntry.createWriter(function(writer) {
        
        writer.addEventListener('writend', function() {
          cb && cb();
        });
        writer.addEventListener('error', errHandler);

        var blob = new Blob([style], {type: 'text/css'});

        writer.write(blob);
      }, errHandler);
    });
  };

})(this, this.document);
