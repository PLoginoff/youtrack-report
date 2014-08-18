function addEmailField() {
    var emails = $('[name="email[]"]'),
        clone = emails.first().clone().val('');

    emails.last().after(clone);
    if (emails.length >= 5) {
        $(this).remove();
    }
}

$('.add-btn').click(addEmailField);

$('.datepicker').datetimepicker({
    direction: 'auto',
    language: 'ru',
    pickTime: false
});

$('button.submit').click(function () {
    var btn = $(this), interval;

    btn.button('loading');
    $('.alert').hide();
    interval = setInterval(function () {
        if (document.cookie.indexOf('downloaded') !== -1) {
            btn.button('reset');
            clearInterval(interval);
        }
    }, 100);
});
