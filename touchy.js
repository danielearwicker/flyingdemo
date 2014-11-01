function log(touches) {
    var ar = [];
    for (var n = 0; n < touches.length; n++) {
        ar.push(touches[n]);
    }
    touches = ar;
    var div = document.querySelector('.viewport');
    div.innerHTML = '<ul>' + touches.map(function (t) { return '<li>' + t.pageX + ', ' + t.pageY + '</li>'; }).join('') + '</ul>';
}
function touchy() {
    document.addEventListener("touchstart", function (ev) {
        log(ev.touches);
        ev.preventDefault();
    });
    document.addEventListener("touchend", function (ev) {
        log(ev.touches);
        ev.preventDefault();
    });
    document.addEventListener("touchmove", function (ev) {
        log(ev.touches);
        ev.preventDefault();
    });
}
