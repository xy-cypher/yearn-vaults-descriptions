import {toAddress} from 'utils';

async function getVaultStrategies({vaultAddress, wantAddress, wantName, tokenTree, vaultTree}) {
	const	vaultTokenAddress = toAddress(vaultAddress);
	const	vaultTokenHasIPFSFile = vaultTree[vaultTokenAddress];

	const	wantTokenAddress = toAddress(wantAddress);
	const	wantTokenName = tokenTree[wantTokenAddress]?.tokenNameOverride || wantName;
	const	wantTokenDescription = tokenTree[wantTokenAddress]?.description || '';
	const	wantTokenHasIPFSFile = tokenTree[wantTokenAddress] ? true : false;

	return ([[
		{ipfs: vaultTokenHasIPFSFile},
		{address: wantTokenAddress, name: wantTokenName, description: wantTokenDescription, ipfs: wantTokenHasIPFSFile},
	], !vaultTokenHasIPFSFile || !wantTokenHasIPFSFile]);
}

async function getTokens({network}) {
	let		vaultDataFromIPFS = await (await fetch(`https://meta.yearn.network/vaults/${network}/all`)).json();
	let		dataFromIPFS = await (await fetch(`https://meta.yearn.network/tokens/${network}/all`)).json();
	const	tokenTree = {};
	const	vaultTree = {};

	for (let index = 0; index < dataFromIPFS.length; index++) {
		const tokenDetails = dataFromIPFS[index];
		const address = tokenDetails.address;
		tokenTree[toAddress(address)] = {
			description: tokenDetails.description || '',
			name: tokenDetails?.tokenNameOverride || '',
			symbol: tokenDetails?.tokenSymbolOverride || ''
		};
	}

	for (let index = 0; index < vaultDataFromIPFS.length; index++) {
		const vaultDetails = vaultDataFromIPFS[index];
		const address = vaultDetails.address;
		vaultTree[toAddress(address)] = true;
	}


	let		vaults = (await (await fetch(`https://api.yearn.finance/v1/chains/${network}/vaults/all`)).json());
	vaults = vaults.filter(e => !e.migration || !e.migration?.available);
	vaults = vaults.filter(e => e.type !== 'v1');
	const	vaultsWithStrats = [];

	for (let index = 0; index < vaults.length; index++) {
		const vault = vaults[index];
		const	[tokens, hasMissingTokenInfo] = await getVaultStrategies({
			vaultAddress: vault.address,
			wantAddress: vault?.token?.address,
			wantName: vault?.token?.name,
			tokenTree,
			vaultTree
		});

		vaultsWithStrats.push({
			address: vault.address || '', 
			symbol: vault.token.symbol || '', 
			name: vault.name || '', 
			display_name: vault.display_name || '', 
			icon: vault.icon || '',
			tokens,
			hasMissingTokenInfo
		});
	}
	return (vaultsWithStrats);
}

const	tokenMapping = {};
let		tokenMappingAccess = {};
export default async function handler(req, res) {
	let		{network, revalidate} = req.query;
	network = Number(network);

	const	now = new Date().getTime();
	const	lastAccess = tokenMappingAccess[network] || 0;
	if (lastAccess === 0 || ((now - lastAccess) > 5 * 60 * 1000) || revalidate === 'true' || !tokenMapping[network]) {
		const	result = await getTokens({network});
		tokenMapping[network] = result;
		tokenMappingAccess[network] = now;
	}
	res.setHeader('Cache-Control', 's-maxage=300'); // 5 minutes
	return res.status(200).json(tokenMapping[network]);
}

export async function listVaultsWithTokens({network = 1}) {
	network = Number(network);
	const	result = await getTokens({network});
	return JSON.stringify(result);
}