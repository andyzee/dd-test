(function() {
    class TempClass {
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
    }
})()