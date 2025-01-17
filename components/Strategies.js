import	React							from	'react';
import	{parseMarkdown}					from	'utils';
import	HeadIconRocket					from	'components/icons/HeadIconRocket';

function	Strategies({strategiesData, vaultSymbol, chainExplorer, shouldHideValids, isRetired}) {
	if (strategiesData.length === 0) {
		return (
			<section aria-label={'STRATEGIES'}>
				<div className={'w-full text-gray-blue-1 dark:text-gray-3'}>
					<i
						className={'text-xs'}
						dangerouslySetInnerHTML={{__html: parseMarkdown('No strategy detected.')}} />
				</div>
			</section>
		);
	}

	const	strategiesWithBoost = ['Curve Boost', 'Convex Reinvest'];
	return (
		<section aria-label={'STRATEGIES'} className={'mt-4 '}>
			{
				strategiesData.filter(s => shouldHideValids ? !s.description : true).map((strategy, index) => (
					<div key={index} className={'flex relative flex-col ml-4 md:ml-12'}>
						<div className={'mb-4 text-gray-blue-1 dark:text-gray-3'}>
							<div className={'flex flex-row items-center mb-2'}>
								<a href={`${chainExplorer}/address/${strategy.address}#code`} target={'_blank'} className={'inline text-yearn-blue hover:underline'} rel={'noreferrer'}>
									{strategy.name}
								</a>
								<div>
									{strategy.noIPFS ? (
										<span className={'py-1 px-2 ml-2 text-xs font-bold text-gray-blue-1 dark:text-gray-3 bg-yearn-blue rounded-md'}>
											{'Missing IPFS file'}
										</span>
									) : null}
									{!isRetired && strategiesWithBoost.includes(strategy.name) ? (
										<HeadIconRocket className={'ml-2'} width={16} height={16} />
									): null}
								</div>
							</div>
							<div className={'pr-4 w-full md:pr-16'}>
								{strategy?.description ? 
									<p className={'inline'} dangerouslySetInnerHTML={{__html: parseMarkdown(strategy?.description.replace(/{{token}}/g, vaultSymbol) || '')}} />
									:
									<i className={'inline'} dangerouslySetInnerHTML={{__html: parseMarkdown('No description provided for this strategy.')}} />
								}
							</div>
						</div>
					</div>
				))
			}
		</section>
	);
}

export default Strategies;