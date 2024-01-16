

async function download() {
    const res = await fetch("http://localhost:3000/file/od", {
        method: "GET",
    });

    if (res.status == 200) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // link.download = 'dummy.pdf';
        console.log("downloading...");
        console.log(blob);
            // link.click();
    }else{
        const errorMessage = await res.json();
        console.log(errorMessage);
    }

}

document.querySelector("#btn").addEventListener('click', async (e) => {
    await download();
    console.log("Hello World");
    console.log("Hello World How re u")
});