/* ============================================
   GROQ AI API CONNECTOR (FREE)
   বাংলাদেশে কাজ করে — No VPN needed!
   ============================================ */
class GeminiAPI {
    constructor() {
        this.loadConfig();
    }

    loadConfig() {
        this.apiKey = localStorage.getItem('groq-api-key') || '';
        this.model = localStorage.getItem('groq-model') || 'llama-3.3-70b-versatile';
    }

    isConfigured() {
        return this.apiKey.length > 10;
    }

    async generate(prompt, options = {}) {
        this.loadConfig();
        if (!this.isConfigured()) {
            throw new Error('⚠️ Groq API Key সেট করা হয়নি। Settings পেজে যান এবং API Key বসান।');
        }

        const systemInstruction = options.system || 'You are a professional YouTube content creator and SEO expert. Always provide unique, creative, high-quality content in the requested language. Never repeat previous content. Add variety each time.';

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt }
                ],
                max_tokens: options.tokens || 2048,
                temperature: options.temp || 0.9,
                top_p: 0.95
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const msg = err?.error?.message || `API Error: ${response.status}`;
            throw new Error(msg);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error('No response from Groq. Try again.');
        }

        return data.choices[0].message.content;
    }

    async generateWithImage(base64Image, prompt, options = {}) {
        // Groq does not support vision/image input
        throw new Error('⚠️ Image analysis feature needs Gemini API (VPN required). Other features work fine with Groq!');
    }

    async testConnection() {
        this.loadConfig();
        try {
            const result = await this.generate('Say "✅ Connection Successful!" in one line.', { tokens: 50 });
            return { ok: true, msg: result };
        } catch (e) {
            return { ok: false, msg: e.message };
        }
    }
}

const gemini = new GeminiAPI();
