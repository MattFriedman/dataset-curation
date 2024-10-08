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
            
            // Parse metadata
            const metadataText = formData.get('metadata');
            const metadata = {};
            metadataText.split('\n').forEach(line => {
                const [key, value] = line.split(':').map(item => item.trim());
                if (key && value) {
                    metadata[key] = value;
                }
            });
            formData.set('metadata', JSON.stringify(metadata));

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
    const creationMethodCell = row.querySelector('td:nth-child(3)'); // Assuming it's the third column
    const categoryCell = row.querySelector('td:nth-child(4)'); // Assuming it's the fourth column
    const metadataCell = row.querySelector('td:nth-child(5)'); // Assuming it's the fifth column
    
    cells.forEach(cell => {
        const rawContent = cell.getAttribute('data-raw-content');
        cell.innerHTML = `<textarea>${rawContent}</textarea>`;
        cell.setAttribute('contenteditable', 'true');
    });

    // Add textarea for metadata
    const metadataContent = metadataCell.textContent.trim();
    metadataCell.innerHTML = `<textarea class="metadata-edit">${metadataContent}</textarea>`;

    // Add dropdown for creation method
    const currentMethod = creationMethodCell.textContent.trim();
    let creationMethodOptionsHtml = Object.entries(Enums.CreationMethod)
        .filter(([key, value]) => typeof value === 'string')
        .map(([key, value]) => 
            `<option value="${value}" ${currentMethod === Enums.CreationMethod.getLabel(value) ? 'selected' : ''}>${Enums.CreationMethod.getLabel(value)}</option>`
        ).join('');
    creationMethodCell.innerHTML = `<select>${creationMethodOptionsHtml}</select>`;

    // Add dropdown for category
    const currentCategory = categoryCell.textContent.trim();
    let categoryOptionsHtml = Enums.Category.values()
        .map(value => 
            `<option value="${value}" ${currentCategory === Enums.Category.getLabel(value) ? 'selected' : ''}>${Enums.Category.getLabel(value)}</option>`
        ).join('');
    categoryCell.innerHTML = `<select>${categoryOptionsHtml}</select>`;

    // Ensure both textareas have the same height
    const textareas = row.querySelectorAll('textarea');
    const maxHeight = Math.max(...Array.from(textareas).map(ta => ta.scrollHeight));
    textareas.forEach(ta => ta.style.height = `${maxHeight}px`);

    // Add save button
    const actionCell = row.querySelector('td:last-child');
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.onclick = () => savePair(id);
    actionCell.appendChild(saveButton);

    // Disable other action buttons instead of hiding them
    actionCell.querySelectorAll('button:not(:last-child)').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
}

function savePair(id) {
    const row = document.querySelector(`tr[data-id='${id}']`);
    const cells = row.querySelectorAll('td[data-raw-content]');
    const creationMethodCell = row.querySelector('td:nth-child(3)');
    const categoryCell = row.querySelector('td:nth-child(4)');
    const metadataCell = row.querySelector('td:nth-child(5)');
    const newData = {};

    cells.forEach((cell, index) => {
        const textarea = cell.querySelector('textarea');
        const newContent = textarea.value;
        const field = index === 0 ? 'instruction' : 'output';
        newData[field] = newContent;
        cell.setAttribute('data-raw-content', newContent);
    });

    newData.creationMethod = creationMethodCell.querySelector('select').value;
    newData.category = categoryCell.querySelector('select').value;
    
    // Parse metadata
    const metadataTextarea = metadataCell.querySelector('.metadata-edit');
    const metadataContent = metadataTextarea.value;
    newData.metadata = {};
    metadataContent.split('\n').forEach(line => {
        const [key, value] = line.split(':').map(item => item.trim());
        if (key && value) {
            newData.metadata[key] = value;
        }
    });

    console.log('Debug: Sending data to server:', newData);

    fetch(`/pairs/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to update pair');
        }
    })
    .then(updatedPair => {
        console.log('Debug: Updated pair received:', updatedPair);
        cells.forEach(cell => {
            cell.innerHTML = '<div class="markdown-content"></div>';
            cell.setAttribute('contenteditable', 'false');
        });
        creationMethodCell.textContent = Enums.CreationMethod.getLabel(updatedPair.creationMethod);
        
        // Check if category exists in the updatedPair before setting it
        if (updatedPair.category) {
            categoryCell.textContent = Enums.Category.getLabel(updatedPair.category);
        } else {
            categoryCell.textContent = 'Unknown';
        }
        
        // Update metadata cell
        metadataCell.innerHTML = Object.entries(updatedPair.metadata || {})
            .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
            .join('') || 'No metadata';
        
        console.log('Debug: Category label set:', categoryCell.textContent);
        renderAllMarkdown();
        
        // Remove save button and re-enable other action buttons
        const actionCell = row.querySelector('td:last-child');
        actionCell.querySelectorAll('button').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
        const saveButton = actionCell.querySelector('button:last-child');
        if (saveButton) {
            actionCell.removeChild(saveButton);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message);
    });
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
