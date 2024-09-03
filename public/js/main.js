document.addEventListener('DOMContentLoaded', function() {
    renderAllMarkdown();
    setupAddPairForm();
});

function setupAddPairForm() {
    const form = document.querySelector('form[action="/pairs"]');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(form);
            fetch('/pairs', {
                method: 'POST',
                body: new URLSearchParams(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Toastify({
                        text: data.message,
                        duration: 3000,
                        close: true,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
                    }).showToast();
                    form.reset();
                } else {
                    Toastify({
                        text: "Error: " + data.message,
                        duration: 3000,
                        close: true,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
                    }).showToast();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Toastify({
                    text: "An error occurred. Please try again.",
                    duration: 3000,
                    close: true,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
                }).showToast();
            });
        });
    }
}

function renderAllMarkdown() {
    document.querySelectorAll('td[data-raw-content]').forEach(cell => {
        const rawContent = cell.getAttribute('data-raw-content');
        const markdownDiv = cell.querySelector('.markdown-content');
        markdownDiv.innerHTML = marked.parse(rawContent);
    });
}

function toggleApproval(id) {
    fetch(`/pairs/${id}/toggle-approval`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const button = document.querySelector(`tr[data-id='${id}'] .approval-btn`);
        const countSpan = document.querySelector(`tr[data-id='${id}'] .approval-count`);
        const svg = button.querySelector('svg');
        
        if (data.approvalCount > 1) {
            svg.innerHTML = `
                <g id="Interface / Check_All_Big">
                    <path id="Vector" d="M7 12L11.9497 16.9497L22.5572 6.34326M2.0498 12.0503L6.99955 17M17.606 6.39355L12.3027 11.6969" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
            `;
        } else {
            svg.innerHTML = `
                <g id="Interface / Check_Big">
                    <path id="Vector" d="M4 12L8.94975 16.9497L19.5572 6.34326" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
            `;
        }
        
        button.classList.toggle('approved', data.approved);
        countSpan.textContent = `${data.approvalCount} approval${data.approvalCount !== 1 ? 's' : ''}`;
    })
    .catch(error => console.error('Error:', error));
}

function editPair(id) {
    const row = document.querySelector(`tr[data-id='${id}']`);
    const cells = row.querySelectorAll('td[data-raw-content]');
    
    cells.forEach(cell => {
        const rawContent = cell.getAttribute('data-raw-content');
        cell.innerHTML = `<textarea>${rawContent}</textarea>`;
        cell.setAttribute('contenteditable', 'true');
    });

    // Add save button
    const actionCell = row.querySelector('td:last-child');
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.onclick = () => savePair(id);
    actionCell.appendChild(saveButton);
}

function savePair(id) {
    const row = document.querySelector(`tr[data-id='${id}']`);
    const cells = row.querySelectorAll('td[data-raw-content]');
    const newData = {};

    cells.forEach((cell, index) => {
        const textarea = cell.querySelector('textarea');
        const newContent = textarea.value;
        const field = index === 0 ? 'instruction' : 'output';
        newData[field] = newContent;
        cell.setAttribute('data-raw-content', newContent);
    });

    fetch(`/pairs/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newData)
    })
    .then(response => {
        if (response.ok) {
            cells.forEach(cell => {
                cell.innerHTML = '<div class="markdown-content"></div>';
                cell.setAttribute('contenteditable', 'false');
            });
            renderAllMarkdown();
            
            // Remove save button
            const actionCell = row.querySelector('td:last-child');
            const saveButton = actionCell.querySelector('button:last-child');
            if (saveButton) {
                actionCell.removeChild(saveButton);
            }
        } else {
            alert('Failed to update pair');
        }
    })
    .catch(error => console.error('Error:', error));
}

function deletePair(id) {
    const row = document.querySelector(`tr[data-id='${id}']`);
    const instructionCell = row.querySelector('td[data-raw-content]:nth-child(1)');
    const outputCell = row.querySelector('td[data-raw-content]:nth-child(2)');
    
    const instruction = instructionCell.getAttribute('data-raw-content');
    const output = outputCell.getAttribute('data-raw-content');

    if (confirm(`Are you sure you want to delete this pair?\n\nInstruction: ${instruction}\nOutput: ${output}`)) {
        fetch(`/pairs/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                row.remove();
            } else {
                alert('Failed to delete pair');
            }
        })
        .catch(error => console.error('Error:', error));
    }
}
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sideMenu = document.getElementById('side-menu');
    const mainContent = document.getElementById('main-content');

    menuToggle.addEventListener('click', function() {
        sideMenu.classList.toggle('active');
        mainContent.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = sideMenu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);

        if (!isClickInsideMenu && !isClickOnToggle && sideMenu.classList.contains('active')) {
            sideMenu.classList.remove('active');
            mainContent.classList.remove('active');
        }
    });

    // Close menu when resizing to larger screen
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && sideMenu.classList.contains('active')) {
            sideMenu.classList.remove('active');
            mainContent.classList.remove('active');
        }
    });
});
