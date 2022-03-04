const template = document.createElement('template')
template.innerHTML = `
        <style>
            .container {
                max-width: 400px;
                display: block;
                padding: .5em 1em;
            }
            label {
                display: block;
                padding: 0 0 .2em 0
            }
            input {
                width: 100%;
                padding: .4em .5em;
            }
            .row {
                padding: 0 0 .5em 0
            }
        </style>

        <div class="container">
            <div class="row">
                <label>Компания или ИП</label>
                <input list="parties" id="party" name="party" type="text" placeholder="Введите название организации или ИП" autocomplete="off" />
                <datalist id="parties"></datalist>
            </div>
            <div class="row">
                <label>Тип</label>
                <input id="type"></input>
            </div>
            <div class="row">
                <label>Краткое наименование</label>
                <input id="name_short">
            </div>
            <div class="row">
                <label>Полное наименование</label>
                <input id="name_full">
            </div>
            <div class="row">
                <label>ИНН / КПП</label>
                <input id="inn_kpp">
            </div>
            <div class="row">
                <label>Адрес</label>
                <input id="address">
            </div>
        </div>
`

class DDSuggestCompaniesAdvanced extends HTMLElement {
    constructor() {
        super()

        this.attachShadow({mode: 'open'})
        this.shadowRoot.appendChild(template.content.cloneNode(true))
        this.token = this.getAttribute('token')
        
        this.data = []
        this.el = {}
        this.fetchController = new AbortController()
        this.queryCache = []
    }
    handleInput() {
        const val = this.el.party.value.trim()
        if(val.length < 2 || this.oldVal == val)
            return;

        this.oldVal = val

        // check if the user chose from the options
        let found = false
        this.el.parties.querySelectorAll('option').forEach((el, i) => {
            if(el.value == val) {
                found = i
                return
            }
        })
        // process chosen option
        if(found !== false)
            return this.fillInfo(found)

        // clear fields
        this.resultFieldNames.forEach(name => this.el[name].value = "")
        this.el.parties.innerHTML = ""

        // cancel current fetch
        if(this.fetching)
            this.fetchController.abort()

        // debounce clear timeout
        if(this.timeout)
            clearTimeout(this.timeout)

        // process data from cache
        if(this.queryCache[val]) {
            console.log('get data from cache')
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
        console.log('..fetching..')
        fetch(url, options)
            .then(response => {
                this.fetching = false; return response.json()
            })
            .then(result => {
                if(!result.suggestions || !result.suggestions.length) {
                    this.data = []
                    console.log('nothing found')
                } else {
                    this.data = result.suggestions
                    this.queryCache[val] = this.data
                    this.processData()
                }
            })
            .catch(error => {
                this.fetching = false; 
                console.error("error", error)
            })
    }
    processData() {
        this.data.forEach(i => {
            const option = document.createElement('option')
            option.setAttribute('value', i.value)
            this.el.parties.appendChild(option)
        })    
    }
    fillInfo(i) {
        const data = this.data[i].data
        console.log(data)
        
        this.el.type.value = `${this.getPartyTypeDescription(data.type)} (${data.type})`
        this.el.name_short.value = data.name.short_with_opf || ''
        this.el.name_full.value = data.name.full_with_opf || ''
        this.el.inn_kpp.value = [data.inn, data.kpp].join(' / ')
        if (data.address) {
            let address = '';
            if (data.address.data.qc == '0') {
                address = [data.address.data.postal_code, data.address.value].join();
            } else {
                address = data.address.data.source;
            }
            this.el.address.value = address
        }

    }
    getPartyTypeDescription(type) {
        const types = {
            'INDIVIDUAL': 'Индивидуальный предприниматель',
            'LEGAL': 'Организация'
        }
        return types[type]
    }
    connectedCallback() {
        ['party', 'parties', 'type', 'name_short', 'name_full', 'inn_kpp', 'address'].forEach((v) => this.el[v] = this.shadowRoot.querySelector(`#${v}`))

        this.resultFieldNames = ['name_short', 'name_full', 'inn_kpp', 'address']
        
        this.el.party.addEventListener('input', () => this.handleInput())
    }
    disconnectedCallback() {

    }
}

window.customElements.define('dd-suggest-companies-advanced', DDSuggestCompaniesAdvanced)