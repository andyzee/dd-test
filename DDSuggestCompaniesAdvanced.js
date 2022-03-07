(function() {

    const template = document.createElement('template')
    template.innerHTML = `
        <style>
        </style>
    `
            
    class DDSuggestCompaniesAdvanced extends HTMLElement {
        constructor() {
            super()
            
            // appending input in light dom to easily style it through global stylesheets
            this.inputField = document.createElement('input')
            const attrs = ['name', 'placeholder', 'autocomplete']
            attrs.forEach(a => this.getAttribute(a) ? this.inputField.setAttribute(a, this.getAttribute(a)) : '')
            this.appendChild(this.inputField)

            // datalist mode
            this.dataList = document.createElement('datalist')
            this.dataList.setAttribute('id', `dd-datalist-${Math.ceil(Math.random()*1e6)}`)
            this.appendChild(this.dataList)

            // connect input to datalist
            this.inputField.setAttribute('list', this.dataList.id)


            // append shadow container, so that it doesn't interfere with input
            this.shadowContainer = document.createElement('div')
            this.appendChild(this.shadowContainer)

            // appending shadow dom used for suggestions popup
            this.shadowContainer.attachShadow({mode: 'open'})
            this.shadowContainer.shadowRoot.appendChild(template.content.cloneNode(true))


            this.token = this.getAttribute('token')
            this.data = []
            this.fetchController = new AbortController()
            this.queryCache = []
        }
        handleInput() {
            const val = this.inputField.value.trim()
            if(val.length < 2 || this.oldVal == val) {
                return;
            }

            this.oldVal = val
            
            // check if the user chose from the options
            let found = false
            this.dataList.querySelectorAll('option').forEach((el, i) => {
                if(el.value == val) {
                    found = i
                    return
                }
            })
            // process chosen option
            if(found !== false)
                return this.fillInfo(found)
                
                // clear fields
                this.dataList.innerHTML = ""

                // cancel current fetch
                if(this.fetching) {
                    this.fetchController.abort()
                    this.fetchController = new AbortController()
            }
            
            // debounce clear timeout
            if(this.timeout)
            clearTimeout(this.timeout)

            // process data from cache
            if(this.queryCache[val]) {
                this.data = this.queryCache[val]
                return this.processData()
            }
            
            // request data with debounce
            this.timeout = setTimeout(() => this.getData(val), 200)
        }
        getData(val) {
            const url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party"
            const options = {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Token " + this.token
                },
                body: JSON.stringify({query: val}),
                signal: this.fetchController.signal
            }
            this.fetching = true
            fetch(url, options)
            .then(response => {
                this.fetching = false 
                return response.json()
            })
                .then(result => {
                    if(!result.suggestions || !result.suggestions.length) {
                        this.data = []
                        console.log('nothing found')
                        this.el.type.value = 'Ничего не найдено'
                    } else {
                        this.data = result.suggestions
                        this.queryCache[val] = this.data
                        this.processData()
                    }
                })
                .catch(error => {
                    this.fetching = false; 
                    console.log("error", error)
                })
            }
        processData() {
            this.data.forEach(i => {
                const option = document.createElement('option')
                option.setAttribute('value', i.value)
                this.dataList.appendChild(option)
            })    
        }
        
        connectedCallback() {
            this.inputField.addEventListener('input', () => this.handleInput())
        }

        disconnectedCallback() {
            this.inputField.removeEventListener()
        }
    }

    window.customElements.define('dd-suggest-companies-advanced', DDSuggestCompaniesAdvanced)

})()