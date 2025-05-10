function openWhatsApp() {
    const phone = "254797100500"; // Your WhatsApp number
    const message = encodeURIComponent("I am using the Mybidhaa website and I would like some assistance");
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  }