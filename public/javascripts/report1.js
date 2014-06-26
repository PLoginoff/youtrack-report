function addEmailField() {
    var emails = $('[name="email[]"]'),
        clone = emails.first().clone().val('');

    emails.last().after(clone);
    if (emails.length >= 5) {
        $(this).remove();
    }
}

$('.add-btn').click(addEmailField);

$('.datepicker').datepicker({
    format: 'dd.mm.yyyy'
});