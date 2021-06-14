const fs = require('fs');

const deleteFile = (filePath, cb) => {
    fs.unlink(filePath, (err) => {
        if(err){
            throw err;
        }

        return cb;
    })
};

module.exports = deleteFile;