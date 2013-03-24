(function(window, document, undefined){
  window.myStyle = window.myStyle || {};

  var MAX_TOTAL_SIZE = 5 * 1024 * 1024; /* 5 MB */
  var STYLE_DIR = 'styles'

  var _errHandler = function (e) {
    var msg = '';

    switch (e.code) {
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

  var _withFilesystem = function (cb){
    var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    window.webkitStorageInfo.requestQuota(PERSISTENT, MAX_TOTAL_SIZE, function(grantedSize){
      requestFileSystem(PERSISTENT, grantedSize, cb, _errHandler);
    }, _errHandler);
  }

  var _getDirectory = function(fs, cb){
    fs.root.getDirectory(STYLE_DIR, {create: true}, cb, _errHandler);
  };

  var _withFileEntry = function(hash, options, cb){
    _withFilesystem(function(fs){
      _getDirectory(fs, function(dir){

        dir.getFile(hash + '.css', options, cb, function(err){
          if (err.code === FileError.NOT_FOUND_ERR)
            cb(undefined);
          else
            _errHandler(err);
        });
      }, _errHandler);
    }, _errHandler);
  };

  window.myStyle.loadStyle = function (hash, cb){
    _withFileEntry(hash, {}, function(fileEntry){

      if (fileEntry === undefined){
        // The file doesn't exist yet.
        cb(undefined);
        return;
      }

      fileEntry.file(function(file){
        var reader = new FileReader();

        reader.onloadend = function(){
          cb(this.result);
        }

        reader.readAsText(file);
      }, _errHandler);
    });
  };

  window.myStyle.saveStyle = function (hash, style, cb){
    _withFileEntry(hash, {create: true}, function(fileEntry){

      fileEntry.createWriter(function(writer){
        
        writer.onwriteend = function(e){
          cb && cb();
        };

        writer.onerror = _errHandler;

        var blob = new Blob([style], {type: 'text/css'});

        writer.write(blob);

      }, _errHandler);
    });
  };

})(this, this.document);
