const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Meal = require('../models/mealModel');

dotenv.config();

function getArgValue(flag) {
	const idx = process.argv.indexOf(flag);
	if (idx === -1) return null;
	return process.argv[idx + 1] || null;
}

function sanitizeFilename(name) {
	return name.replace(/[\\/:*?"<>|]/g, '_');
}

function isIgnoredTopLevelDir(dirName) {
	return [
		'.git',
		'.vitepress',
		'docker_support',
		'docs',
		'images'
	].includes(dirName);
}

function listRecipeMarkdownFiles(sourceRoot) {
	const results = [];

	const level1 = fs.readdirSync(sourceRoot, { withFileTypes: true })
		.filter(d => d.isDirectory())
		.map(d => d.name)
		.filter(name => !isIgnoredTopLevelDir(name));

	for (const category of level1) {
		const categoryDir = path.join(sourceRoot, category);
		const entries = fs.readdirSync(categoryDir, { withFileTypes: true });
		for (const ent of entries) {
			if (ent.isDirectory()) {
				const subcategory = ent.name;
				const subDir = path.join(categoryDir, subcategory);
				const files = fs.readdirSync(subDir, { withFileTypes: true })
					.filter(f => f.isFile() && f.name.endsWith('.md') && f.name !== 'README.md')
					.map(f => path.join(subDir, f.name));
				for (const f of files) {
					results.push({ filePath: f, category, subcategory });
				}
				continue;
			}
			if (ent.isFile() && ent.name.endsWith('.md') && ent.name !== 'README.md') {
				results.push({ filePath: path.join(categoryDir, ent.name), category, subcategory: '' });
			}
		}
	}

	return results;
}

function extractSectionLines(lines, headerText) {
	const headerRegex = new RegExp(`^##\\s*${headerText}\\s*$`);
	const startIdx = lines.findIndex(l => headerRegex.test(l.trim()));
	if (startIdx === -1) return [];
	const out = [];
	for (let i = startIdx + 1; i < lines.length; i++) {
		const raw = lines[i];
		const t = raw.trim();
		if (t.startsWith('## ')) break;
		out.push(raw);
	}
	return out;
}

function parseRecipeMd(md, absoluteFilePath) {
	const lines = md.split(/\r?\n/);

	let name = '';
	for (const l of lines) {
		const t = l.trim();
		if (t.startsWith('# ')) {
			name = t.slice(2).trim();
			break;
		}
	}

	let imageRel = '';
	let imageAlt = '';
	for (const l of lines) {
		const m = l.match(/!\[([^\]]*)\]\(([^)]+)\)/);
		if (m) {
			imageAlt = (m[1] || '').trim();
			imageRel = (m[2] || '').trim();
			break;
		}
	}

	let description = '';
	if (imageRel) {
		const imgLineIdx = lines.findIndex(l => l.includes(`](${imageRel}`));
		if (imgLineIdx !== -1) {
			const descLines = [];
			for (let i = imgLineIdx + 1; i < lines.length; i++) {
				const t = lines[i].trim();
				if (!t) continue;
				if (t.startsWith('## ')) break;
				if (t.startsWith('<!--')) continue;
				descLines.push(t);
			}
			description = descLines.join(' ').trim();
		}
	}

	const ingredientLines = extractSectionLines(lines, '配料');
	const ingredients = ingredientLines
		.map(l => l.trim())
		.filter(l => l.startsWith('- '))
		.map(l => ({ name: l.replace(/^\-\s+/, '').trim(), amount: '' }))
		.filter(i => i.name);

	const stepLines = extractSectionLines(lines, '步骤');
	const steps = stepLines
		.map(l => l.trim())
		.filter(l => l.startsWith('- '))
		.map(l => l.replace(/^\-\s+/, '').trim())
		.map(s => s.replace(/^\d+\.?\s*/, '').trim())
		.filter(Boolean);

	return {
		name,
		imageRel,
		imageAlt,
		description,
		ingredients,
		steps,
		absoluteFilePath
	};
}

async function main() {
	const sourceRoot = getArgValue('--source') || path.resolve(__dirname, '..', '..', 'CookLikeHOC');
	const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'cooklikehoc');
	const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017/whateat?authSource=admin';

	if (!fs.existsSync(sourceRoot)) {
		throw new Error(`CookLikeHOC source directory not found: ${sourceRoot}`);
	}

	fs.mkdirSync(uploadsDir, { recursive: true });

	const mdFiles = listRecipeMarkdownFiles(sourceRoot);
	const results = {
		processed: 0,
		upserted: 0,
		skipped: 0,
		imagesCopied: 0
	};

	await mongoose.connect(mongoUri);

	for (const item of mdFiles) {
		results.processed++;
		const relPath = path.relative(sourceRoot, item.filePath).split(path.sep).join('/');

		const raw = fs.readFileSync(item.filePath, 'utf8');
		const parsed = parseRecipeMd(raw, item.filePath);
		if (!parsed.name) {
			results.skipped++;
			continue;
		}

		let imageUrl = '';
		if (parsed.imageRel) {
			const srcImg = path.resolve(path.dirname(item.filePath), parsed.imageRel);
			if (fs.existsSync(srcImg)) {
				const base = sanitizeFilename(path.basename(parsed.imageRel));
				const prefix = sanitizeFilename([item.category, item.subcategory].filter(Boolean).join('-'));
				const destName = prefix ? `${prefix}-${base}` : base;
				const destPath = path.join(uploadsDir, destName);
				if (!fs.existsSync(destPath)) {
					fs.copyFileSync(srcImg, destPath);
					results.imagesCopied++;
				}
				imageUrl = `/uploads/cooklikehoc/${destName}`;
			}
		}

		const tags = ['CookLikeHOC', item.category].filter(Boolean);
		if (item.subcategory) tags.push(item.subcategory);

		const doc = {
			name: parsed.name,
			description: (parsed.description || '').slice(0, 500),
			imageUrl,
			tags,
			ingredients: parsed.ingredients,
			steps: parsed.steps,
			category: item.category,
			subcategory: item.subcategory,
			source: 'CookLikeHOC',
			sourcePath: relPath
		};

		await Meal.findOneAndUpdate(
			{ name: doc.name, category: doc.category, subcategory: doc.subcategory, source: 'CookLikeHOC' },
			{ $set: doc, $setOnInsert: { createdAt: new Date() } },
			{ upsert: true, new: true }
		);
		results.upserted++;
	}

	await mongoose.connection.close();
	console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
