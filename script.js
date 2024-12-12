console.clear()
let harData = null
let logs = []
function exportJSONToCSV(jsonData, filename = 'export.csv') {
    const headers = Object.keys(jsonData[0])
    const csvRows = jsonData.map((row) =>
        headers.map((header) => JSON.stringify(row[header])).join(',')
    )
    const csvString = [headers.join(','), ...csvRows].join('\n')
    const csvContent =
        'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString)

    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', filename)
    document.body.appendChild(link) // Required for FF
    link.click()
}

function processHarFile(har) {
    let apexCallDetails
    for (let a of har.log.entries) {
        apexCallDetails = {
            classname: null,
            method: null,
            payload: null,
            payload: null,
        }
        const options = {
            // weekday: "long",
            //   year: "numeric",
            //   month: "long",
            //   day: "numeric",
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            fractionalSecondDigits: 3,
        }

        const formatter = new Intl.DateTimeFormat('en-US', options)
        let startedDateTime = new Date(a.startedDateTime)
        let endDateTime = new Date(a.startedDateTime)
        endDateTime.setMilliseconds(endDateTime.getMilliseconds() + a.time)

        if (a.request.url.indexOf('Apex') != -1) {
            if (a.request.postData?.text) {
                const params = new URLSearchParams(a.request.postData?.text)
                for (const [name, value] of params) {
                    try {
                        let apexAPI = JSON.parse(` ${value}`).actions[0].params
                        apexCallDetails = {
                            classname: apexAPI.classname,
                            method: apexAPI.method,
                            payload: apexAPI.params,
                        }
                    } catch (e) {}
                }
            }
        }
        let location = new URL(a.request.url)
        logs.push({
            url: a.request.url,
            startedDateTime: formatter.format(startedDateTime),
            endDateTime: formatter.format(endDateTime),
            time: a.time,
            hostname: location.hostname,
            classname: apexCallDetails.classname,
            method: apexCallDetails.method,
            payload: apexCallDetails.payload
                ? JSON.stringify(apexCallDetails.payload)
                : '',
        })
    }
}
window.addEventListener('load', (event) => {
    document.getElementById('file').addEventListener('change', (event) => {
        const file = event.target.files[0]
        let reader = new FileReader()
        reader.onload = (event) => {
            harData = JSON.parse(event.target.result)
        }
        reader.readAsText(file)
    })
    document.getElementById('submit').addEventListener('click', () => {
        document.getElementById('file').value = null
        processHarFile(harData)
        exportJSONToCSV(logs)
    })
})
