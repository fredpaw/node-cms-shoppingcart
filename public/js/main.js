$(function() {

  if(document.querySelector( 'textarea#ta' )) {
    ClassicEditor
      .create( document.querySelector( 'textarea#ta' ) )
      .catch( error => {
          console.error( error );
      });
  }

  $('a.confirmDeletion').on('click', function() {
    if(!confirm('Confirm deletion')) return false;
  });

  if($("[data-fancybox]").length) {
    $("[data-fancybox]").fancybox();
  }
});