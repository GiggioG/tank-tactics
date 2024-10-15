export default async function main(){
    const list = await (await fetch(`${location.origin}/api/list_users`)).json();
    const ul = document.querySelector("ul#userlist");
    
    list.forEach(u => {
        let li = document.createElement("li");
        li.innerText = u;
        if (u == sessionUname) {
            li.classList.add("highlighted");
            li.innerText += " (You)";
        }
        ul.appendChild(li);
    });
}
