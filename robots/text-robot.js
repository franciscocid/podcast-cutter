const algorithmia = require('algorithmia')
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
  await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  // breakContentIntoSentences(content)

  async function fetchContentFromWikipedia(content) {
    const algorithmiaAuthenticated = algorithmia(process.env.ALGORITHMIA_KEY)
    const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
    const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
    const wikipediaContent = wikipediaResponse.get()
    content.sourceContentOriginal = wikipediaContent.content
  }

  function sanitizeContent(content) {
      const withoutBlankLines = removeBlankLines(content.sourceContentOriginal)
      const withoutMarkdown = removeMarkdown(withoutBlankLines)
      const withoutDates = removeDates(withoutMarkdown)
      
      content.sourceContentSanitized = withoutDates
      content.sentences = breakContentIntoSentences(content.sourceContentSanitized)

      function removeBlankLines(text) {
        const allLines = text.split('\n')
        return allLines.map(line => line.trim())
                       .filter(line => line.trim().length !== 0)
      }

      function removeMarkdown(lines) {
        return lines.filter(line => !line.startsWith('=')).join(' ')
      }

      function removeDates(text) {
        return text.replace(/ ?\(\w+ \d{2}, \d{4} . \w+ \d{2}, \d{4}\) ?/g, '')
      }

      function breakContentIntoSentences(text) {
        const sentences = []

        sentenceBoundaryDetection.sentences(text).forEach(sentence => {
          sentences.push({
            text: sentence,
            keywords: [],
            images: []
          })
        })

        return sentences
      }
  }
}

module.exports = robot