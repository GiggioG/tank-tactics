const getActiveModalBkg = () => document.querySelector("div.modalBkg.active");

function closeModal(){
    let active = getActiveModalBkg();
    if(!active){ return; }
    active.classList.remove("active");
}

function openModal(modalBkg){
    closeModal();
    modalBkg.classList.add("active");
}