// script ini berjalan di browser

const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    // ambil elemen article (tampilan produk) yg terdekat dgn button delete ini
    const productElement= btn.closest('article');

    console.log(`${prodId} and ${csrf}`);

    // kirim data json ke server, fetch nggak cm retrieve data, tapi juga bisa kirim
    // perhatikan bahwa package csurf juga mampu menghandle kiriman token via header, jd nggak selalu harus lewat body
    // data ini masuk ke router admin untuk handle delete product
    // route pakai /admin/... krn ini absolute path
    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(results => {
        console.log(results);
        return results.json()
    })
    .then(data => {
        console.log(data);
        // langsung render page ulang di browser (bkn dr kiriman server)
        productElement.parentNode.removeChild(productElement);

        // TAMPILAN PAGINATION MASIH PERLU DIPERBAIKI SETELAH RENDER ULANG
    })
    .catch(err => {
        console.log(err);
    })
};