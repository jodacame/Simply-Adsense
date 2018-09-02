




function background(){
    app.report();
    setTimeout(background,15 * 60 * 1000);
}

background();
