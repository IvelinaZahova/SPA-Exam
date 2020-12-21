export async function successNotification(message){
    
    const successBox = document.getElementById('successBox');
    successBox.style.display = 'block';
    successBox.style.background = '#393'
    successBox.textContent = message;

    setTimeout(() => successBox.style.display = 'none', 2000);
}

export async function errorNotification(message){
    
    const errorBox = document.getElementById('errorBox');
    errorBox.style.display = 'block';
    errorBox.style.background = '#F50'
    errorBox.textContent = message;

    setTimeout(() => errorBox.style.display = 'none', 2000);
}